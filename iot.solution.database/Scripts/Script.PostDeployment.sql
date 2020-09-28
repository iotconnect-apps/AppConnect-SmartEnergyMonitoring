IF NOT EXISTS (SELECT TOP 1 1 FROM dbo.[configuration] WHERE [configKey] = 'db-version')
BEGIN
	INSERT [dbo].[Configuration] ([guid], [configKey], [value], [isDeleted], [createdDate], [createdBy], [updatedDate], [updatedBy]) 
	VALUES (N'cf45da4c-1b49-49f5-a5c3-8bc29c1999ea', N'db-version', N'0', 0, GETUTCDATE(), NULL, GETUTCDATE(), NULL)
END

IF NOT EXISTS (SELECT TOP 1 1 FROM dbo.[configuration] WHERE [configKey] = 'telemetry-last-exectime')
BEGIN
	INSERT [dbo].[Configuration] ([guid], [configKey], [value], [isDeleted], [createdDate], [createdBy], [updatedDate], [updatedBy]) 
	VALUES (N'465970b2-8bc3-435f-af97-8ca26f2bf383', N'telemetry-last-exectime', N'2020-01-01 12:08:02.380', 0, GETUTCDATE(), NULL, GETUTCDATE(), NULL)
END

IF NOT EXISTS(SELECT 1 FROM dbo.[configuration] WHERE [configKey] = 'db-version') 
	OR ((SELECT CONVERT(FLOAT,[value]) FROM dbo.[configuration] WHERE [configKey] = 'db-version') < 1 )
BEGIN

	INSERT [dbo].[KitType] ([guid], [companyGuid], [name], [code], [tag], [isActive], [isDeleted], [createdDate], [createdBy], [updatedDate], [updatedBy]) VALUES (N'5DD233D4-7B05-4B1C-85EC-1AD7B13C7916', NULL, N'Default', N'Default', NULL, 1, 0, CAST(N'2020-02-12T13:20:44.217' AS DateTime), N'68aa338c-ebd7-4686-b350-de844c71db1f', NULL, NULL)
	
	INSERT [dbo].[KitTypeAttribute] ([guid], [parentTemplateAttributeGuid], [templateGuid], [localName], [code], [tag], [description]) VALUES (N'7DFF7A2C-DE14-4068-9BDD-4CCBE051CF11', NULL, N'5DD233D4-7B05-4B1C-85EC-1AD7B13C7916', N'currentin', N'currentin', NULL, N'currentin')
	INSERT [dbo].[KitTypeAttribute] ([guid], [parentTemplateAttributeGuid], [templateGuid], [localName], [code], [tag], [description]) VALUES (N'1805A278-BB74-42FE-AD53-2313015C180F', NULL, N'5DD233D4-7B05-4B1C-85EC-1AD7B13C7916', N'voltage', N'voltage', NULL, N'voltage')
	
	INSERT INTO [dbo].[AdminUser] ([guid],[email],[companyGuid],[firstName],[lastName],[password],[isActive],[isDeleted],[createdDate]) VALUES (NEWID(),'admin@energy.com','AB469212-2488-49AD-BC94-B3A3F45590D2','Smart Energy','admin','Softweb#123',1,0,GETUTCDATE())
	
	INSERT [dbo].[UserDasboardWidget] ([Guid], [DashboardName], [Widgets], [IsDefault], [IsSystemDefault], [UserId], [IsActive], [IsDeleted], [CreatedDate], [CreatedBy], [ModifiedDate], [ModifiedBy]) VALUES (N'2AFB7737-9F88-4BD1-9447-14D495E40DE0', N'Default Dashboard', N'[]', 0, 1, N'00000000-0000-0000-0000-000000000000', 1, 0, CAST(N'2020-07-06T14:52:39.567' AS DateTime), N'00000000-0000-0000-0000-000000000000', CAST(N'2020-07-06T14:53:09.490' AS DateTime), N'00000000-0000-0000-0000-000000000000')

	UPDATE [dbo].[Configuration]
	SET [value]  = '1'
	WHERE [configKey] = 'db-version'

END
GO