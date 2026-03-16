<?php

namespace App\Services;

use App\Repositories\BaseRepository;

abstract class BaseService
{
    /** @var BaseRepository */
    protected $repository;

    public function __construct(BaseRepository $repository)
    {
        $this->repository = $repository;
    }
}
