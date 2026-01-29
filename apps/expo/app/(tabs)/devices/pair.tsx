import { DevicePairScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export default function DevicePairPage() {
  const nav = useNav();
  return <DevicePairScreen nav={nav} />;
}
