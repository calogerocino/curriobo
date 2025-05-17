import { MenuItem } from 'src/app/core/sidebar/menu.model'; 

export const CUSTOMER_MENU: MenuItem[] = [
  {
    label: 'generale.layout.menu.main',
    isTitle: true,
  },
  {
    label: 'Dashboard',
    icon: 'home',
    link: '/cliente/dashboard',
  },
  {
    label: 'customer.menu.profile',
    icon: 'user',
    link: '/cliente/account',
  },
  {
    label: 'customer.menu.currio',
    icon: 'edit-3',
    link: '/cliente/currio',
  },
];
