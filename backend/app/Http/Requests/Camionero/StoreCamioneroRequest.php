<?php

namespace App\Http\Requests\Camionero;

use Illuminate\Foundation\Http\FormRequest;

class StoreCamioneroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id'          => ['required', 'exists:users,id'],
            'nombre'           => ['required', 'string', 'max:100'],
            'apellidos'        => ['required', 'string', 'max:150'],
            'email'            => ['required', 'email', 'max:255', 'unique:camioneros,email'],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'licencia'         => ['required', 'string', 'max:20', 'unique:camioneros,licencia'],
            'fecha_nacimiento' => ['required', 'date'],
        ];
    }
}
