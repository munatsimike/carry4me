import type { Listing } from "../domain/Listing";

export function toggleLike<T extends Listing>(
  id: string,
  setList: React.Dispatch<React.SetStateAction<T[]>>
) {
  setList(prev =>
    prev.map(item =>
      item.id === id
        ? { ...item, isLiked: !item.isLiked }
        : item
    )
  );
}
