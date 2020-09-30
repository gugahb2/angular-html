export interface Meeting {
    name: string;
    people: string;
    allowGuests: boolean;
    date: string;
    dateValues: object;
    addAttachments: boolean;
    recordMeeting: boolean;
    hostUid: string;
    meetupId: string;
}
