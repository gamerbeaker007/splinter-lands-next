"use client";

import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import CollectionContent from "@/components/player-overview/collection-overview/CollectionContent";

export default function CollectionPage() {
  return (
    <>
      <CardFilterDrawer />
      <CollectionContent />
    </>
  );
}
