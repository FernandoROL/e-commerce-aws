enum productEventType {
    CREATED = "PRODUCT_CREATED",
    UPDATED = "PRODUCT_UPDATED",
    DELETED = "PRODUCT_DELETED"
}

interface ProductEvent {
    requestId: string;
    eventType: productEventType;
    productId: string;
    productCode: string;
    productPrice: number;
    email: string;
}


export {productEventType, ProductEvent}