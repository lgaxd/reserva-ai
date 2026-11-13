import { RoleTabs } from '@/components/RoleTabs';

export default function SindicoLayout() {
  return (
    <RoleTabs
      role="sindico"
      tabs={[
        { name: 'agenda', title: 'Agenda', icon: 'calendar-outline' },
        { name: 'gerenciar-areas', title: 'Áreas', icon: 'construct-outline', headerShown: false },
        { name: 'conta', title: 'Perfil', icon: 'person-outline' },
      ]}
    />
  );
}
