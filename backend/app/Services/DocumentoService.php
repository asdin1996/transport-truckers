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

    public function byTrip(int $viajeId)
    {
        return $this->repository->byTrip($viajeId);
    }

    public function find(int $id): ?Documento
    {
        return $this->repository->findWithViaje($id);
    }

    public function create(array $data, UploadedFile $file): Documento
    {
        $data['nombre_original'] = $file->getClientOriginalName();
        $data['archivo'] = $file->store('documentos', 'local');

        return $this->repository->create($data);
    }

    public function update(int $id, array $data, ?UploadedFile $file): bool
    {
        if ($file) {
            $document = $this->repository->findById($id);
            if ($document?->archivo) {
                Storage::disk('local')->delete($document->archivo);
            }
            $data['nombre_original'] = $file->getClientOriginalName();
            $data['archivo'] = $file->store('documentos', 'local');
        }

        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $document = $this->repository->findById($id);
        if ($document?->archivo) {
            Storage::disk('local')->delete($document->archivo);
        }

        return $this->repository->delete($id);
    }

    public function download(Documento $document)
    {
        return Storage::disk('local')->download($document->archivo, $document->nombre_original);
    }

    public function canAccess(Documento $document, int $camioneroId, bool $isAdmin): bool
    {
        if ($isAdmin) {
            return true;
        }

        return $document->viaje->camionero_id === $camioneroId;
    }
}
