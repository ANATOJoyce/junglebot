import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectionDto } from './create-product-collection.dto';


export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}