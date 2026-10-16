/**
 * Localize CMS/marketing items that expose *_km fields.
 */
export function localize(item, lang = 'en') {
  if (!item || lang !== 'km') return item;

  const mapped = { ...item };
  if (item.name_km) mapped.name = item.name_km;
  if (item.title_km) mapped.title = item.title_km;
  if (item.tagline_km) mapped.tagline = item.tagline_km;
  if (item.description_km) mapped.description = item.description_km;
  if (item.caption_km) mapped.caption = item.caption_km;
  if (item.resort_km) mapped.resort = item.resort_km;
  if (item.subtitle_km) mapped.subtitle = item.subtitle_km;
  if (item.location_km) mapped.location = item.location_km;
  if (item.destination_km) mapped.destination = item.destination_km;
  if (item.badge_km) mapped.badge = item.badge_km;
  if (item.type_km) mapped.type = item.type_km;
  if (item.bedType_km) mapped.bedType = item.bedType_km;
  if (item.view_km) mapped.view = item.view_km;
  if (item.cuisine_km) mapped.cuisine = item.cuisine_km;
  if (item.category_km) mapped.category = item.category_km;
  if (item.duration_km) mapped.duration = item.duration_km;
  if (item.schedule_km) mapped.schedule = item.schedule_km;
  if (item.hours_km) mapped.hours = item.hours_km;
  if (item.signatureDish_km) mapped.signatureDish = item.signatureDish_km;
  if (item.dressCode_km) mapped.dressCode = item.dressCode_km;
  if (item.amenities_km && Array.isArray(item.amenities_km)) mapped.amenities = item.amenities_km;
  if (item.features_km && Array.isArray(item.features_km)) mapped.features = item.features_km;
  if (item.comment_km) mapped.comment = item.comment_km;
  if (item.stayType_km) mapped.stayType = item.stayType_km;
  if (item.country_km) mapped.country = item.country_km;
  if (item.resortName_km) mapped.resortName = item.resortName_km;
  if (item.message_km) mapped.message = item.message_km;
  return mapped;
}
