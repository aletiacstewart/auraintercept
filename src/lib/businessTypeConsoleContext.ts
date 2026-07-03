/**
 * Unified per-business-type context resolver used by every console so
 * Field Ops, Business Mgmt, Customer Portal, Analytics, and Specialist
 * operatives all share the same lookup of profile + marketing matrix +
 * group-summary derived from the 185-row spec.
 */
import { getProfileForBusinessType } from './businessTypeProfileMap';
import {
  getMatrixRowForBusinessType,
  getGroupSummary,
  topChannels,
  type MatrixRow,
  type GroupSummary,
  type ChannelMeta,
} from './marketingPlatformMatrix';
import { getProfileSpec, type ProfileKey, type ProfileSpec } from './industryProfiles';

export interface BusinessTypeConsoleContext {
  /** Resolved profile key (A–J). */
  profileKey: ProfileKey;
  profileSpec: ProfileSpec;
  /** Matrix row if business type or vertical maps to a known entry. */
  matrixRow: MatrixRow | null;
  /** Group-level platform summary for the matrix category. */
  groupSummary: GroupSummary | null;
  /** Top N channels (highest priority) from the matrix row, if any. */
  topChannels: ChannelMeta[];
  /** Best display label — exact business type first, then vertical, else profile label. */
  displayLabel: string;
}

export function getConsoleContext(
  businessType: string | null | undefined,
  industryVertical: string | null | undefined = null,
  topN = 3,
): BusinessTypeConsoleContext {
  const profileKey = getProfileForBusinessType(businessType ?? industryVertical);
  const profileSpec = getProfileSpec(profileKey);
  const matrixRow =
    getMatrixRowForBusinessType(businessType) ??
    getMatrixRowForBusinessType(industryVertical);
  const groupSummary = matrixRow ? getGroupSummary(matrixRow.category) : null;
  const top = matrixRow ? topChannels(matrixRow, topN) : [];
  const humanize = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const displayLabel =
    matrixRow?.name ??
    humanize(businessType || industryVertical || profileSpec.label || '');
  return { profileKey, profileSpec, matrixRow, groupSummary, topChannels: top, displayLabel };
}