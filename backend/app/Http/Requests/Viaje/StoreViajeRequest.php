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
            'camionero_id' => ['required', 'exists:camioneros,id'],
            'vehiculo_id' => ['nullable', 'exists:vehiculos,id'],
            'ruta_id' => ['nullable', 'exists:rutas,id'],
            'estado' => ['sometimes', 'in:' . implode(',', Viaje::ESTADOS)],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
