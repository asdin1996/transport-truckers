<?php

namespace App\Http\Requests\Camionero;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCamioneroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('camionero');

        return [
            'nombre'           => ['sometimes', 'string', 'max:100'],
            'apellidos'        => ['sometimes', 'string', 'max:150'],
            'email'            => ['sometimes', 'email', 'max:255', 'unique:camioneros,email,' . $id],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'licencia'         => ['sometimes', 'string', 'max:20', 'unique:camioneros,licencia,' . $id],
            'fecha_nacimiento' => ['sometimes', 'date'],
        ];
    }
}
