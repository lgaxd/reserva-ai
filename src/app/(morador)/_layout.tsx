import { RoleTabs } from '@/components/RoleTabs';

export default function MoradorLayout() {
  return (
    <RoleTabs
      role="morador"
      tabs={[
        { name: 'areas', title: 'Áreas', icon: 'grid-outline', headerShown: false },
        { name: 'minhas-reservas', title: 'Minhas reservas', icon: 'calendar-outline' },
        { name: 'perfil', title: 'Perfil', icon: 'person-outline' },
      ]}
    />
  );
}
