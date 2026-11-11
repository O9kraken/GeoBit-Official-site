import * as migration_20261030_183414_initial from './20261030_183414_initial';
import * as migration_20261111_190647_users_avatar_post_author from './20261111_190647_users_avatar_post_author';

export const migrations = [
  {
    up: migration_20261030_183414_initial.up,
    down: migration_20261030_183414_initial.down,
    name: '20261030_183414_initial',
  },
  {
    up: migration_20261111_190647_users_avatar_post_author.up,
    down: migration_20261111_190647_users_avatar_post_author.down,
    name: '20261111_190647_users_avatar_post_author'
  },
];
