export function normalizeCustomer(record: any) {
    const email = record['Email']?.trim();
    const firstName = record['First Name']?.trim();
    const lastName = record['Last Name']?.trim();
    const phone =
        record['Phone 1']?.trim() ||
        record['Phone 2']?.trim() ||
        null;

    if (!email) return null;

    return {
        email,
        name: [firstName, lastName].filter(Boolean).join(' ') || null,
        phone,
    };
}
