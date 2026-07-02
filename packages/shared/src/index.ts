import { z } from "zod";

//------------------------------------------------------------------------------
// HAGGLE MODE STATE MACHINE
//------------------------------------------------------------------------------

export type HaggleStatus = 'open' | 'accepted' | 'declined' | 'expired';
export type HaggleOfferedBy = 'buyer' | 'vendor' | 'system';

export interface HaggleState {
  status: HaggleStatus;
  roundCount: number;
  maxRounds: number;
}

export const HAGGLE_MAX_ROUNDS_DEFAULT = 5;

/**
 * Validates a transition in the Haggle State Machine
 */
export function transitionHaggle(
  currentState: HaggleState,
  action: 'buyer_offer' | 'vendor_counter' | 'vendor_accept' | 'vendor_decline' | 'system_auto_decline'
): HaggleState {
  const { status, roundCount, maxRounds } = currentState;

  if (status !== 'open') {
    throw new Error(`Cannot transition haggle thread from non-open status: ${status}`);
  }

  switch (action) {
    case 'buyer_offer':
      if (roundCount >= maxRounds) {
        return { status: 'declined', roundCount, maxRounds };
      }
      return { status: 'open', roundCount: roundCount + 1, maxRounds };

    case 'vendor_counter':
      if (roundCount >= maxRounds) {
        return { status: 'declined', roundCount, maxRounds };
      }
      return { status: 'open', roundCount: roundCount + 1, maxRounds };

    case 'vendor_accept':
      return { status: 'accepted', roundCount, maxRounds };

    case 'vendor_decline':
    case 'system_auto_decline':
      return { status: 'declined', roundCount, maxRounds };

    default:
      return currentState;
  }
}

//------------------------------------------------------------------------------
// ESCROW STATE MACHINE
//------------------------------------------------------------------------------

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';

export interface EscrowState {
  status: EscrowStatus;
}

/**
 * Validates transitions in the Escrow State Machine
 */
export function transitionEscrow(
  currentState: EscrowState,
  action: 'release' | 'refund' | 'dispute' | 'cancel_dispute'
): EscrowState {
  const { status } = currentState;

  switch (status) {
    case 'held':
      if (action === 'release') return { status: 'released' };
      if (action === 'refund') return { status: 'refunded' };
      if (action === 'dispute') return { status: 'disputed' };
      break;

    case 'disputed':
      if (action === 'release') return { status: 'released' };
      if (action === 'refund') return { status: 'refunded' };
      if (action === 'cancel_dispute') return { status: 'held' };
      break;

    default:
      break;
  }

  throw new Error(`Invalid escrow transition: cannot perform "${action}" on status "${status}"`);
}

//------------------------------------------------------------------------------
// ZOD VALIDATION SCHEMAS
//------------------------------------------------------------------------------

export const OfferSchema = z.object({
  amount: z.number().positive("Offer price must be greater than 0"),
  message: z.string().max(300, "Message must be 300 characters or less").optional(),
});

export const AddressSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  phone: z.string().min(8, "Valid phone number required"),
  streetAddress: z.string().min(5, "Address is too short"),
  city: z.string().min(2, "City is too short"),
  state: z.string().min(2, "State is too short"),
});

export const StorefrontSettingsSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  bannerUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code"),
});
