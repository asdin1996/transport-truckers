<?php

namespace App\Http\Requests\Viaje;

use App\Models\Viaje;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CambiarEstadoRequest extends FormRequest
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
            'estado' => ['required', 'in:' . implode(',', Viaje::ESTADOS)],
        ];
    }
}
