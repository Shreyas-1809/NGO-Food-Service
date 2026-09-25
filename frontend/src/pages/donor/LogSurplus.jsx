import React from 'react';
import DonorPostForm from '../../components/DonorPostForm';
import { useParams } from 'react-router-dom';

/**
 * Page for donors to log a new surplus food item.
 * It re‑uses the existing `DonorPostForm` component.
 */
export default function LogSurplus({ socket, user, token }) {
  // No URL params needed currently, but kept for future extensions.
  return (
    <div className="max-w-2xl mx-auto p-4">
      <DonorPostForm socket={socket} user={user} token={token} onSuccess={() => {}}
        prefill={null}
      />
    </div>
  );
}
