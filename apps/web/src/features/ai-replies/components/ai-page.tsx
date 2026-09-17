'use client';

import { useState } from 'react';
import { AiProfileForm } from './ai-profile-form';
import { AiSandbox } from './ai-sandbox';

/** S-REV-05: profile + sandbox side by side. */
export function AiPageBody() {
  const [profileId, setProfileId] = useState<string | null>(null);
  return (
    <div className='grid items-start gap-6 lg:grid-cols-2'>
      <AiProfileForm profileId={profileId} onProfileChange={setProfileId} />
      <AiSandbox profileId={profileId} />
    </div>
  );
}
