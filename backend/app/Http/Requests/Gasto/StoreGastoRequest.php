<?php

namespace App\Http\Requests\Gasto;

use App\Models\Gasto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreGastoRequest extends FormRequest
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
            'tipo' => ['required', 'in:' . implode(',', Gasto::TIPOS)],
            'importe' => ['required', 'numeric', 'min:0.01'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'fecha' => ['required', 'date'],
            'foto_ticket' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB
        ];
    }
}
