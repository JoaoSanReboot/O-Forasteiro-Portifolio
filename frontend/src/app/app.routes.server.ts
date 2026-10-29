import { RenderMode, ServerRoute } from '@angular/ssr';

// página única, toda gerada no build (SSG) para o Azure Static Web Apps
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
