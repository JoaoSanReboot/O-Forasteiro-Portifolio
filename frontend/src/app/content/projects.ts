import { ChestLook } from '../engine/figures/chest';

// os baús da ferraria (seção Projetos)
export interface Project extends ChestLook {
  name: string;
  kick: string;
  title: string;
  desc: string;
  chips: readonly string[];
  href: string;
  link: string;
  img: string;
  alt: string;
  /** "Em produção" */
  wip?: boolean;
}

export const PROJECTS: readonly Project[] = [
  {
    num: 'I', name: 'Ukra', kick: 'Baú I',
    title: 'Totem e Gestão de Pedidos',
    desc: 'Um projeto para automatizar e aumentar a eficiência do estabelecimento, desenvolvido com C# Forms, integrado ao MySQL e com design próprio. Consiste em um totem fixo para realizar pedidos e outro painel para visualizá-los.',
    chips: ['C#', 'Windows Forms', 'MySQL'], href: 'https://github.com/JoaoSanReboot/UkraBar', link: 'GitHub ↗',
    wood: '#7a4a2a', iron: '#4a4644', trim: '#c0902a', img: 'assets/ukra-logo.svg', alt: 'Logo do Ukra Bar',
  },
  {
    num: 'II', name: 'Shogun Team', kick: 'Baú II',
    title: 'Link Tree',
    desc: 'Uma link tree desenvolvida para uma academia de lutas, facilitando a divulgação de contatos, localização e horários de atendimento. Utiliza apenas HTML, CSS e JavaScript.',
    chips: ['HTML', 'CSS', 'JavaScript'], href: 'https://shogun-team-link-tree.vercel.app', link: 'Ver Projeto ↗',
    wood: '#6a3a28', iron: '#3a3634', trim: '#a8322a', img: 'assets/shogunimage.png', alt: 'Logo da Shogun Team',
  },
  {
    num: 'III', name: 'José, o Jogo', kick: 'Baú III', wip: true,
    title: 'Adivinhe a Música',
    desc: 'Um jogo ainda em desenvolvimento no qual o jogador precisa adivinhar a música a partir do áudio ou da capa do álbum.',
    chips: ['.NET 10', 'SQL Server', 'Angular'], href: 'https://jose-o-jogo.vercel.app', link: 'Jogar ↗',
    wood: '#5a3a24', iron: '#5a4a42', trim: '#e0602a', img: 'assets/jose-image.svg', alt: 'Mascote do José, o Jogo', hot: true,
  },
];
