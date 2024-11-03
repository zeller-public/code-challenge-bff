type RuleType = "discount" | "reducedPrice" | "both";

interface RuleDefinition {
  quantity?: number; // For discount rule (e.g., 3-for-2)
  discountedQuantity?: number; // Quantity that will be charged in multi-buy deal
  bulkPrice?: number; // New price if more than specified quantity is purchased
}

export class PricingRule {
  constructor(
    public skuId: string,
    public type: RuleType,
    public definition: RuleDefinition
  ) {
    this.validateDefinition();
  }

  private validateDefinition(): void {
    switch (this.type) {
      case "discount":
        if (
          typeof this.definition.quantity !== "number" ||
          typeof this.definition.discountedQuantity !== "number"
        ) {
          throw new Error(
            `Invalid definition for discount rule on SKU ${this.skuId}. Expected "quantity" and "discountedQuantity" to be numbers.`
          );
        }
        break;

      case "reducedPrice":
        if (
          typeof this.definition.quantity !== "number" ||
          typeof this.definition.bulkPrice !== "number"
        ) {
          throw new Error(
            `Invalid definition for reduced price rule on SKU ${this.skuId}. Expected "quantity" and "bulkPrice" to be numbers.`
          );
        }
        break;

      case "both":
        if (
          typeof this.definition.quantity !== "number" ||
          typeof this.definition.discountedQuantity !== "number" ||
          typeof this.definition.bulkPrice !== "number"
        ) {
          throw new Error(
            `Invalid definition for combined rule on SKU ${this.skuId}. Expected "quantity", "discountedQuantity", and "bulkPrice" to be numbers.`
          );
        }
        break;

      default:
        throw new Error(`Unknown rule type: ${this.type}`);
    }
  }

  apply(count: number, price: number): number {
    switch (this.type) {
      case "discount":
        return this.applyDiscount(count, price);

      case "reducedPrice":
        return this.applyReducedPrice(count, price);

      case "both":
        return this.applyBoth(count, price);

      default:
        return count * price; // Regular price if no rule type matches
    }
  }

  private applyDiscount(count: number, price: number): number {
    const discountSets = Math.floor(count / this.definition.quantity!);
    const remainingItems = count % this.definition.quantity!;
    return (
      (discountSets * this.definition.discountedQuantity! + remainingItems) *
      price
    );
  }

  private applyReducedPrice(count: number, price: number): number {
    if (count > this.definition.quantity!) {
      return count * this.definition.bulkPrice!;
    }
    return count * price;
  }

  private applyBoth(count: number, price: number): number {
    // Step 1: Apply multi-buy discount (e.g., "3 for 2" offer)
    const discountSets = Math.floor(count / this.definition.quantity!);
    const discountedItemsCount =
      discountSets * this.definition.discountedQuantity!;
    const remainingItems = count % this.definition.quantity!;

    // Step 2: Check if the total count qualifies for the bulk price
    const totalDiscountedCount = discountedItemsCount + remainingItems;
    if (totalDiscountedCount > this.definition.quantity!) {
      return totalDiscountedCount * this.definition.bulkPrice!;
    }

    // Step 3: Calculate total using standard price for remaining items
    return (discountedItemsCount + remainingItems) * price;
  }
}
