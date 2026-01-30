<?php

namespace App\Http\Requests\Gasto;

use App\Models\Gasto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGastoRequest extends FormRequest
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
            'tipo' => ['sometimes', 'in:' . implode(',', Gasto::TIPOS)],
            'importe' => ['sometimes', 'numeric', 'min:0.01'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'fecha' => ['sometimes', 'date'],
            'foto_ticket' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
