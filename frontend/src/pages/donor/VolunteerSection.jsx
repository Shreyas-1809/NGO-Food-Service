import React from 'react';
import VolunteerTaskPage from '../../components/VolunteerTaskPage';

/**
 * Volunteer section shown on the donor dashboard after a donation
 * has been accepted. For now it simply renders the existing
 * `VolunteerTaskPage`. Future logic can control its visibility via
 * donation status.
 */
export default function VolunteerSection({ socket, user, token }) {
  return <VolunteerTaskPage socket={socket} user={user} token={token} />;
}
