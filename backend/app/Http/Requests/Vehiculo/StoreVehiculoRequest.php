<?php

namespace App\Http\Requests\Vehiculo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreVehiculoRequest extends FormRequest
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
            'empresa_id' => ['nullable', 'exists:empresas,id'],
            'matricula' => ['required', 'string', 'max:10', 'unique:vehiculos,matricula'],
            'marca' => ['required', 'string', 'max:50'],
            'modelo' => ['required', 'string', 'max:100'],
            'anio' => ['required', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
        ];
    }
}
