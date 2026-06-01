import MenuItem from './MenuItem';

export default function MenuSection({ section }) {
  const hasImages = section.items.some((item) => item.image);

  return (
    <div>
      <h2 className="text-red-500 text-2xl lg:text-3xl font-bold mb-4">{section.title}</h2>
      <div
        className={`grid gap-4 ${
          hasImages
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
        }`}
      >
        {section.items.map((item) => (
          <MenuItem key={item._id ?? item.name} item={item} promotion={item.promotion ?? section.promotion} />
        ))}
      </div>
    </div>
  );
}
