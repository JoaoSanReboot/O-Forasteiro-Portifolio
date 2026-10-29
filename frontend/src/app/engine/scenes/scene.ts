import { Ctx } from '../core/canvas';

// cada cena: focus (x do centro de interesse), back (estático atrás), front (estático na frente), draw e after (animados)
export interface SceneDef {
  readonly focus: number;
  back(g: Ctx): void;
  front?(g: Ctx): void;
  draw(g: Ctx, t: number, dt: number): void;
  after?(g: Ctx, t: number, dt: number): void;
  /** com movimento reduzido a cena fica parada, a não ser enquanto isto for verdade (segredo do Saloon) */
  acting?(): boolean;
}
