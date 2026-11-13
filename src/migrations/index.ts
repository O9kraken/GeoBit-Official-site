import * as migration_20261030_183414_initial from './20261030_183414_initial';
import * as migration_20261111_190647_users_avatar_post_author from './20261111_190647_users_avatar_post_author';
import * as migration_20261111_193653_seo_geo_aeo from './20261111_193653_seo_geo_aeo';
import * as migration_20261113_065500_home_og_image from './20261113_065500_home_og_image';

export const migrations = [
  {
    up: migration_20261030_183414_initial.up,
    down: migration_20261030_183414_initial.down,
    name: '20261030_183414_initial',
  },
  {
    up: migration_20261111_190647_users_avatar_post_author.up,
    down: migration_20261111_190647_users_avatar_post_author.down,
    name: '20261111_190647_users_avatar_post_author',
  },
  {
    up: migration_20261111_193653_seo_geo_aeo.up,
    down: migration_20261111_193653_seo_geo_aeo.down,
    name: '20261111_193653_seo_geo_aeo'
  },
  {
    up: migration_20261113_065500_home_og_image.up,
    down: migration_20261113_065500_home_og_image.down,
    name: '20261113_065500_home_og_image',
  },
];
