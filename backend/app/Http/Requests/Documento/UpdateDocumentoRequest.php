<?php

namespace App\Http\Requests\Documento;

use App\Models\Documento;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentoRequest extends FormRequest
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
            'tipo' => ['sometimes', 'in:' . implode(',', Documento::TIPOS)],
            'archivo' => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'fecha' => ['sometimes', 'date'],
        ];
    }
}
