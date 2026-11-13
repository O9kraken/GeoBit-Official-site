import * as migration_20261030_183414_initial from './20261030_183414_initial';
import * as migration_20261111_190647_users_avatar_post_author from './20261111_190647_users_avatar_post_author';
import * as migration_20261111_193653_seo_geo_aeo from './20261111_193653_seo_geo_aeo';
import * as migration_20261113_065500_home_og_image from './20261113_065500_home_og_image';
import * as migration_20261113_111432_landings from './20261113_111432_landings';
import * as migration_20261113_120000_home_og_image_2 from './20261113_120000_home_og_image_2';
import * as migration_20261113_130000_landings_content from './20261113_130000_landings_content';
import * as migration_20261113_131000_services_geo_meta from './20261113_131000_services_geo_meta';
import * as migration_20261113_140000_seo_fill from './20261113_140000_seo_fill';

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
    name: '20261111_193653_seo_geo_aeo',
  },
  {
    up: migration_20261113_065500_home_og_image.up,
    down: migration_20261113_065500_home_og_image.down,
    name: '20261113_065500_home_og_image',
  },
  {
    up: migration_20261113_111432_landings.up,
    down: migration_20261113_111432_landings.down,
    name: '20261113_111432_landings',
  },
  {
    up: migration_20261113_120000_home_og_image_2.up,
    down: migration_20261113_120000_home_og_image_2.down,
    name: '20261113_120000_home_og_image_2'
  },
  {
    up: migration_20261113_130000_landings_content.up,
    down: migration_20261113_130000_landings_content.down,
    name: '20261113_130000_landings_content',
  },
  {
    up: migration_20261113_131000_services_geo_meta.up,
    down: migration_20261113_131000_services_geo_meta.down,
    name: '20261113_131000_services_geo_meta',
  },
  {
    up: migration_20261113_140000_seo_fill.up,
    down: migration_20261113_140000_seo_fill.down,
    name: '20261113_140000_seo_fill',
  },
];
