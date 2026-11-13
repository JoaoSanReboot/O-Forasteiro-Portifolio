// Os projetos (seção Projetos)
export interface Project {
  /** numeral da lista */
  num: string;
  name: string;
  title: string;
  desc: string;
  chips: readonly string[];
  href: string;
  /** o que o link faz ("Ver no GitHub", "Ver o site", "Jogar") */
  action: string;
  img: string;
  alt: string;
  /** ainda em desenvolvimento */
  wip?: boolean;
}

export const PROJECTS: readonly Project[] = [
  {
    num: 'I', name: 'Ukra',
    title: 'Totem e Gestão de Pedidos',
    desc: 'Um projeto para automatizar e aumentar a eficiência do estabelecimento, desenvolvido com C# Forms, integrado ao MySQL e com design próprio. Consiste em um totem fixo para realizar pedidos e outro painel para visualizá-los.',
    chips: ['C#', 'Windows Forms', 'MySQL'], href: 'https://github.com/JoaoSanReboot/UkraBar', action: 'Ver no GitHub',
    img: 'assets/ukra-logo.svg', alt: 'Logo do Ukra Bar',
  },
  {
    num: 'II', name: 'Shogun Team',
    title: 'Link Tree',
    desc: 'Uma link tree desenvolvida para uma academia de lutas, facilitando a divulgação de contatos, localização e horários de atendimento. Utiliza apenas HTML, CSS e JavaScript.',
    chips: ['HTML', 'CSS', 'JavaScript'], href: 'https://shogun-team-link-tree.vercel.app', action: 'Ver o site',
    img: 'assets/shogunimage.png', alt: 'Logo da Shogun Team',
  },
  {
    num: 'III', name: 'José, o Jogo', wip: true,
    title: 'Adivinhe a Música',
    desc: 'Um jogo ainda em desenvolvimento no qual o jogador precisa adivinhar a música a partir do áudio ou da capa do álbum.',
    chips: ['.NET 10', 'SQL Server', 'Angular'], href: 'https://jose-o-jogo.vercel.app', action: 'Jogar',
    img: 'assets/jose-image.svg', alt: 'Mascote do José, o Jogo',
  },
];
