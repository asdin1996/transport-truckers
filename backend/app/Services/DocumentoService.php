<?php

namespace App\Services;

use App\Models\Documento;
use App\Repositories\DocumentoRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentoService extends BaseService
{
    public function __construct(DocumentoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function porViaje(int $viajeId)
    {
        return $this->repository->porViaje($viajeId);
    }

    public function obtener(int $id): ?Documento
    {
        return $this->repository->findWithViaje($id);
    }

    public function crear(array $data, UploadedFile $archivo): Documento
    {
        $data['nombre_original'] = $archivo->getClientOriginalName();
        $data['archivo'] = $archivo->store('documentos', 'local');

        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data, ?UploadedFile $archivo): bool
    {
        if ($archivo) {
            $documento = $this->repository->findById($id);
            if ($documento?->archivo) {
                Storage::disk('local')->delete($documento->archivo);
            }
            $data['nombre_original'] = $archivo->getClientOriginalName();
            $data['archivo'] = $archivo->store('documentos', 'local');
        }

        return $this->repository->update($id, $data);
    }

    public function eliminar(int $id): bool
    {
        $documento = $this->repository->findById($id);
        if ($documento?->archivo) {
            Storage::disk('local')->delete($documento->archivo);
        }

        return $this->repository->delete($id);
    }

    public function descargar(Documento $documento)
    {
        return Storage::disk('local')->download($documento->archivo, $documento->nombre_original);
    }

    public function puedeAcceder(Documento $documento, int $camioneroId, bool $esAdmin): bool
    {
        if ($esAdmin) {
            return true;
        }

        return $documento->viaje->camionero_id === $camioneroId;
    }
}
