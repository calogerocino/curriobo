import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'generale.layout.menu.main',
    isTitle: true,
  },
  {
    label: 'generale.layout.menu.dashboard',
    icon: 'home',
    link: '/admin/dashboard',
  },
  {
    label: 'generale.layout.menu.sito',
    icon: 'corner-down-left',
    link: '',
  },
  {
    label: 'generale.layout.menu.richieste',
    isTitle: true,
  },
  {
    label: 'generale.layout.menu.richieste',
    icon: 'file-text',
    subItems: [
      {
        label: 'generale.layout.menu.richieste.listarichieste',
        link: '/admin/currio/listacurrio',
      },
      {
        label: 'generale.layout.menu.richieste.listacurrio',
        link: '/admin/currio/listacurrio',
      },
    ],
  },
  {
    label: 'generale.layout.menu.contabilita.utenti',
    isTitle: true,
  },
  {
    label: 'generale.layout.menu.listautenti',
    icon: 'users',
    link: '/admin/utente/utenti',
  },
];
