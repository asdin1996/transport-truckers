<?php

namespace App\Http\Requests\Ruta;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRutaRequest extends FormRequest
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
            'origen' => ['sometimes', 'string', 'max:100'],
            'destino' => ['sometimes', 'string', 'max:100'],
            'km_estimados' => ['nullable', 'integer', 'min:1'],
            'paradas' => ['nullable', 'array'],
            'paradas.*' => ['string', 'max:100'],
        ];
    }
}
