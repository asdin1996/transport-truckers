<?php

namespace App\Http\Requests\Documento;

use App\Models\Documento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentoRequest extends FormRequest
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
            'viaje_id' => ['required', 'exists:viajes,id'],
            'tipo' => ['required', 'in:' . implode(',', Documento::TIPOS)],
            'archivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'], // 10MB
            'fecha' => ['required', 'date'],
        ];
    }
}
