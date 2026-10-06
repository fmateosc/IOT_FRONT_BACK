// src/modules/schedules/task/dtos/update.task.dto.ts

import { PartialType } from "@nestjs/mapped-types";
import { TaskDto } from "./task.dto.js";

export class UpdateTaskDto extends PartialType(TaskDto) {}