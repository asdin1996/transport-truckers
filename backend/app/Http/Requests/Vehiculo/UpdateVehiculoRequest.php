<?php

namespace App\Http\Requests\Vehiculo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVehiculoRequest extends FormRequest
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
            'matricula' => ['sometimes', 'string', 'max:10', 'unique:vehiculos,matricula,' . $this->route('vehiculo')],
            'marca' => ['sometimes', 'string', 'max:50'],
            'modelo' => ['sometimes', 'string', 'max:100'],
            'anio' => ['sometimes', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
        ];
    }
}
