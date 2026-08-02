import React from 'react';
import { ConsolidatedUnavailableModal } from './ConsolidatedUnavailableModal.jsx';

/**
 * BatchSubstitutionModal
 * Renders the consolidated batch substitution prompt modal listing all pending ask_first items,
 * with top shortcut batch buttons (Accept All / Skip All) and per-item controls (Replace / Let Picker Decide / Skip).
 */
export const BatchSubstitutionModal = (props) => {
  return <ConsolidatedUnavailableModal {...props} />;
};

export default BatchSubstitutionModal;
