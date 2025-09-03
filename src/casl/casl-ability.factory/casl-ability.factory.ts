import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';

import { Role } from '../../auth/role.enum';
import { User } from '../../user/entities/user.entity';
import { Store } from 'src/store/entities/store.entity';
import { Action } from '../action.enum';
import { Order } from 'src/order/entities/CommandePrincipale/order.entity';

type Subjects = InferSubjects<typeof Order | typeof User | typeof Store> | 'all';

export type AbilityTuple = [Action, Subjects];

export type AppAbility = MongoAbility<AbilityTuple>;
@Injectable()
export class CaslAbilityFactory {
  createForUser(user?: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<MongoAbility<[Action, Subjects]>>(createMongoAbility);

    if (!user) {
      // Cas anonyme ou non authentifié
      can(Action.Read, 'all'); // ou limite encore plus
    } else if (user.role?.includes(Role.ADMIN)) {
      can(Action.Manage, 'all');
    } else if (user.role === Role.VENDOR) {
      can(Action.Read, 'all');
      can(Action.Create, Order);
      cannot(Action.Delete, Order);
    } else if (user.role === Role.CUSTOMER) {
      can(Action.Read, 'all');
      can(Action.Create, Order);
      cannot(Action.Delete, Order);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
