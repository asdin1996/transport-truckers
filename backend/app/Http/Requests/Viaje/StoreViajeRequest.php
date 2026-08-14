<?php

namespace App\Http\Requests\Viaje;

use App\Models\Viaje;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreViajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'camionero_id'                => ['nullable', 'exists:camioneros,id'],
            'vehiculo_id'                 => ['nullable', 'exists:vehiculos,id'],
            'tipo'                        => ['sometimes', 'in:' . implode(',', Viaje::TIPOS)],
            'tipo_material_id'            => ['nullable', 'exists:tipos_material,id'],
            'organizacion_contratante_id' => ['nullable', 'exists:organizaciones_contratantes,id'],
            'origen'                      => ['nullable', 'string', 'max:255'],
            'destino'                     => ['nullable', 'string', 'max:255'],
            'fecha_inicio'                => ['nullable', 'date'],
            'fecha_fin'                   => ['nullable', 'date'],
            'notas'                       => ['nullable', 'string', 'max:1000'],
        ];
    }
}
