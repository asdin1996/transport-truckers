<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('mapon:sync')->hourly();
