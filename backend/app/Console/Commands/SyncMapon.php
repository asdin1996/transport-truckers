<?php

namespace App\Console\Commands;

use App\Services\MaponService;
use Illuminate\Console\Command;

class SyncMapon extends Command
{
    protected $signature   = 'mapon:sync';
    protected $description = 'Sincroniza vehículos y conductores desde la API de Mapon';

    public function handle(MaponService $service): void
    {
        $this->info('Sincronizando vehículos…');
        try {
            $veh = $service->syncVehiculos();
            $this->line("  Vehículos: {$veh['created']} creados, {$veh['updated']} actualizados, {$veh['skipped']} omitidos");
        } catch (\RuntimeException $e) {
            $this->error('  Error vehículos: ' . $e->getMessage());
        }

        $this->info('Sincronizando camioneros…');
        try {
            $cam = $service->syncCamioneros();
            $this->line("  Camioneros: {$cam['created']} creados, {$cam['updated']} actualizados, {$cam['skipped']} omitidos");
        } catch (\RuntimeException $e) {
            $this->error('  Error camioneros: ' . $e->getMessage());
        }

        $this->info('Sincronizando zonas…');
        try {
            $zon = $service->syncZonas();
            $this->line("  Zonas: {$zon['created']} creadas, {$zon['updated']} actualizadas, {$zon['skipped']} omitidas");
        } catch (\RuntimeException $e) {
            $this->error('  Error zonas: ' . $e->getMessage());
        }
    }
}
