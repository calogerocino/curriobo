import { MenuItem } from 'src/app/core/sidebar/menu.model'; // Riusa il modello

export const CUSTOMER_MENU: MenuItem[] = [
  {
    label: 'generale.layout.menu.main', // Usa chiavi di traduzione
    isTitle: true,
  },
  {
    label: 'Dashboard', // Potrebbe essere una home della dashboard cliente
    icon: 'home',
    link: '/cliente/dashboard',
  },
  {
    label: 'customer.menu.profile', // 'Il Mio Profilo'
    icon: 'user',
    link: '/cliente/account',
  },
  {
    label: 'customer.menu.currio', // 'Il Mio Curriò'
    icon: 'edit-3', // o un'icona più adatta per 'currio'/'portfolio'
    link: '/cliente/currio',
  },
];
