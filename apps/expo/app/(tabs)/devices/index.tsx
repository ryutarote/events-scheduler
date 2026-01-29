import { DeviceListScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export default function DevicesPage() {
  const nav = useNav();
  return <DeviceListScreen nav={nav} />;
}
