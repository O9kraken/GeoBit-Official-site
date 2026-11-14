import * as migration_20261030_183414_initial from './20261030_183414_initial';
import * as migration_20261111_190647_users_avatar_post_author from './20261111_190647_users_avatar_post_author';
import * as migration_20261111_193653_seo_geo_aeo from './20261111_193653_seo_geo_aeo';
import * as migration_20261113_065500_home_og_image from './20261113_065500_home_og_image';
import * as migration_20261113_111432_landings from './20261113_111432_landings';
import * as migration_20261113_114831_settings_ya_badge from './20261113_114831_settings_ya_badge';
import * as migration_20261113_120000_home_og_image_2 from './20261113_120000_home_og_image_2';
import * as migration_20261113_120814_schedule_publish from './20261113_120814_schedule_publish';
import * as migration_20261113_130000_landings_content from './20261113_130000_landings_content';
import * as migration_20261113_131000_services_geo_meta from './20261113_131000_services_geo_meta';
import * as migration_20261113_140000_seo_fill from './20261113_140000_seo_fill';
import * as migration_20261113_150000_blog_posts from './20261113_150000_blog_posts';
import * as migration_20261113_160000_schedule_posts from './20261113_160000_schedule_posts';
import * as migration_20261113_170000_pd_compliance from './20261113_170000_pd_compliance';
import * as migration_20261113_180000_settings_profile_links from './20261113_180000_settings_profile_links';
import * as migration_20261113_181000_blog_posts_dec from './20261113_181000_blog_posts_dec';
import * as migration_20261113_190000_users_admin_look from './20261113_190000_users_admin_look';
import * as migration_20261114_100000_pet_projects from './20261114_100000_pet_projects';
import * as migration_20261114_101000_faq_more from './20261114_101000_faq_more';
import * as migration_20261114_110000_blog_posts_20 from './20261114_110000_blog_posts_20';
import * as migration_20261114_120000_portfolio_texts from './20261114_120000_portfolio_texts';
import * as migration_20261114_130000_portfolio_media from './20261114_130000_portfolio_media';
import * as migration_20261114_140000_testimonials_project from './20261114_140000_testimonials_project';
import * as migration_20261114_150000_seo_meta_fix from './20261114_150000_seo_meta_fix';

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
    up: migration_20261113_114831_settings_ya_badge.up,
    down: migration_20261113_114831_settings_ya_badge.down,
    name: '20261113_114831_settings_ya_badge',
  },
  {
    up: migration_20261113_120000_home_og_image_2.up,
    down: migration_20261113_120000_home_og_image_2.down,
    name: '20261113_120000_home_og_image_2',
  },
  {
    up: migration_20261113_120814_schedule_publish.up,
    down: migration_20261113_120814_schedule_publish.down,
    name: '20261113_120814_schedule_publish',
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
  {
    up: migration_20261113_150000_blog_posts.up,
    down: migration_20261113_150000_blog_posts.down,
    name: '20261113_150000_blog_posts'
  },
  {
    up: migration_20261113_160000_schedule_posts.up,
    down: migration_20261113_160000_schedule_posts.down,
    name: '20261113_160000_schedule_posts',
  },
  {
    up: migration_20261113_170000_pd_compliance.up,
    down: migration_20261113_170000_pd_compliance.down,
    name: '20261113_170000_pd_compliance',
  },
  {
    up: migration_20261113_180000_settings_profile_links.up,
    down: migration_20261113_180000_settings_profile_links.down,
    name: '20261113_180000_settings_profile_links',
  },
  {
    up: migration_20261113_181000_blog_posts_dec.up,
    down: migration_20261113_181000_blog_posts_dec.down,
    name: '20261113_181000_blog_posts_dec',
  },
  {
    up: migration_20261113_190000_users_admin_look.up,
    down: migration_20261113_190000_users_admin_look.down,
    name: '20261113_190000_users_admin_look',
  },
  {
    up: migration_20261114_100000_pet_projects.up,
    down: migration_20261114_100000_pet_projects.down,
    name: '20261114_100000_pet_projects',
  },
  {
    up: migration_20261114_101000_faq_more.up,
    down: migration_20261114_101000_faq_more.down,
    name: '20261114_101000_faq_more',
  },
  {
    up: migration_20261114_110000_blog_posts_20.up,
    down: migration_20261114_110000_blog_posts_20.down,
    name: '20261114_110000_blog_posts_20',
  },
  {
    up: migration_20261114_120000_portfolio_texts.up,
    down: migration_20261114_120000_portfolio_texts.down,
    name: '20261114_120000_portfolio_texts',
  },
  {
    up: migration_20261114_130000_portfolio_media.up,
    down: migration_20261114_130000_portfolio_media.down,
    name: '20261114_130000_portfolio_media',
  },
  {
    up: migration_20261114_140000_testimonials_project.up,
    down: migration_20261114_140000_testimonials_project.down,
    name: '20261114_140000_testimonials_project',
  },
  {
    up: migration_20261114_150000_seo_meta_fix.up,
    down: migration_20261114_150000_seo_meta_fix.down,
    name: '20261114_150000_seo_meta_fix',
  },
];
