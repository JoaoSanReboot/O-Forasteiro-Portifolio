// O que o xerife diz sobre os segredos: moedas, o revólver do Xavier, o segredo do Saloon e o reinício
export const SECRETS_LINES = {
  allFound: 'Achou tudo que tinha escondido por aqui? Tá mais esperto que eu, sô!',
  keepLooking: 'Tá procurando os segredos da região, é? Fique de olho... Às vezes as coisas mais estranhas tão bem debaixo do nosso nariz!',
  fullPockets: 'Ora, ora... Parece que seus bolsos tão cheios agora! Acho que já dá pra comprar um revórvi com o Xavier, não?',
  gunPrice: (price: number, missing: number) =>
    `Esse aí é o revórvi aprimorado do Xavier. Custa ${price} moedas de ouro, e ainda falta${missing > 1 ? 'm' : ''} ${missing}. Procura mais, sô!`,
  gunBought: 'Negócio fechado! Com esse revórvi, as faixas vermelhas do duelo também valem. Agora sim, hein?',
  pianoFound: 'Eita! O Tião já trocou o cartaz... Mas essa arte eu vi, viu? Tá anotada!',
  resetAsk: 'Quer que eu esconda tudo de novo? As moedas, o revórvi do Xavier e os segredos voltam pro lugar.',
  resetYes: 'Sim, esconder tudo',
  resetDone: 'Pronto! Escondi tudo de novo. Boa caçada, forasteiro!',
} as const;
