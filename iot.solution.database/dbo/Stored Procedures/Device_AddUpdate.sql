
/*******************************************************************
DECLARE @output INT = 0
	,@fieldName	nvarchar(255)
	,@newid UNIQUEIDENTIFIER

EXEC [dbo].[Device_AddUpdate]
	@companyGuid			= '895019CF-1D3E-420C-828F-8971253E5784'
	,@entityGuid			= '5330D171-DA1E-4554-A868-87D222CD5D35'
	,@templateGuid			= '12A5CD86-F6C6-455F-B27A-EFE587ED410D'
	,@parentDeviceGuid		= '12A5CD86-F6C6-455F-B27A-EFE587ED410D'
	,@typeGuid					= 1
	,@uniqueId				= 'Device656 uniqueId'
	,@name					= 'Device 656 name'
	,@note					= 'Device 656 note'
	,@tag					= 'Device 656 tag'
	,@image					= 'sdfsdfsdfsdf.jpg'
	,@isProvisioned			= 0
	,@invokingUser			= '200EDCFA-8FF1-4837-91B1-7D5F967F5129'
	,@version				= 'v1'
	,@output				= @output		OUTPUT
	,@fieldName				= @fieldName	OUTPUT
	,@newid					= @newid		OUTPUT

SELECT @output status, @fieldName fieldname,@newid newid

001	sgh-1 05-12-2019 [Nishit Khakhi]	Added Initial Version to Add Update Device
*******************************************************************/

CREATE PROCEDURE [dbo].[Device_AddUpdate]
(	@guid				UNIQUEIDENTIFIER
	,@companyGuid		UNIQUEIDENTIFIER
	,@entityGuid		UNIQUEIDENTIFIER
	,@parentDeviceGuid	UNIQUEIDENTIFIER	= NULL
	,@templateGuid		UNIQUEIDENTIFIER
	,@typeGuid			UNIQUEIDENTIFIER	
	,@uniqueId			NVARCHAR(500)
	,@name	 			NVARCHAR(500)
	,@description		NVARCHAR(1000)		= NULL
	,@specification		NVARCHAR(1000)		= NULL
	,@note				NVARCHAR(1000)		= NULL
	,@tag				NVARCHAR(50)		= NULL
	,@image				NVARCHAR(200)		= NULL
	,@isProvisioned		BIT					= 0
	,@invokingUser		UNIQUEIDENTIFIER
	,@version			NVARCHAR(10)
	,@output			SMALLINT			OUTPUT
	,@fieldName			NVARCHAR(100)		OUTPUT
	,@newid				UNIQUEIDENTIFIER   	OUTPUT
	,@culture			NVARCHAR(10)		= 'en-Us'
	,@enableDebugInfo	 CHAR(1)			= '0'
)
AS
BEGIN
	SET NOCOUNT ON
	DECLARE @dt DATETIME = GETUTCDATE()
    IF (@enableDebugInfo = 1)
	BEGIN
        DECLARE @Param XML
        SELECT @Param =
        (
            SELECT 'Device_AddUpdate' AS '@procName'
			, CONVERT(nvarchar(MAX),@guid) AS '@guid'
			, CONVERT(nvarchar(MAX),@companyGuid) AS '@companyGuid'
			, CONVERT(nvarchar(MAX),@entityGuid) AS '@entityGuid'
			, CONVERT(nvarchar(MAX),@templateGuid) AS '@templateGuid'
			, CONVERT(nvarchar(MAX),@typeGuid) AS '@typeGuid'
			, @uniqueId AS '@uniqueId'
            , @name AS '@name'
			, @description AS '@description'
			, @specification AS '@specification'
			, @note AS '@note'
			, @tag AS '@tag'
			, @image AS '@image'
			, CONVERT(nvarchar(MAX),@isProvisioned) AS '@isProvisioned'
            , CONVERT(nvarchar(MAX),@invokingUser) AS '@invokingUser'
            , CONVERT(nvarchar(MAX),@version) AS '@version'
            , CONVERT(nvarchar(MAX),@output) AS '@output'
            , CONVERT(nvarchar(MAX),@fieldName) AS '@fieldName'
			, CONVERT(nvarchar(MAX),@guid) AS '@newid'
            	FOR XML PATH('Params')
	    )
	    INSERT INTO DebugInfo(data, dt) VALUES(Convert(nvarchar(MAX), @Param), @dt)
    END

	SET @output = 1
	SET @fieldName = 'Success'
	
	BEGIN TRY
		
		SET @newid = @guid
		BEGIN TRAN
			IF NOT EXISTS(SELECT TOP 1 1 FROM [dbo].[Device] (NOLOCK) where [guid] = @guid AND companyGuid = @companyGuid AND isdeleted = 0)
			BEGIN	
				INSERT INTO [dbo].[Device]
			           ([guid]
			           ,[companyGuid]
			           ,[entityGuid]
			           ,[templateGuid]
					   ,[parentDeviceGuid]
			           ,[typeGuid]
			           ,[uniqueId]
			           ,[name]
					   ,[description]
					   ,[specification]
					   ,[note]
					   ,[tag]
					   ,[image]
					   ,[isProvisioned]
			           ,[isActive]
					   ,[isDeleted]
			           ,[createdDate]
			           ,[createdBy]
			           ,[updatedDate]
			           ,[updatedBy]
						)
			     VALUES
			           (@guid
			           ,@companyGuid
			           ,@entityGuid
			           ,@templateGuid
					   ,@parentDeviceGuid
			           ,@typeGuid
			           ,@uniqueId
			           ,@name
					   ,@description
					   ,@specification
					   ,@note
			           ,@tag
			           ,@image
					   ,@isProvisioned
					   ,1
			           ,0
			           ,@dt
			           ,@invokingUser				   
					   ,@dt
					   ,@invokingUser				   
				       );
			END
			ELSE
			BEGIN
				UPDATE [dbo].[Device]
				SET	[entityGuid] = @entityGuid
					,[parentDeviceGuid] = @parentDeviceGuid
					,[templateGuid] = @templateGuid
					,[typeGuid] = @typeGuid
					,[name] = @name
					,[description] = @description
					,[specification] = @specification
					,[tag] = ISNULL(@tag,[tag])
					,[note] = ISNULL(@note,[note])
					,[isProvisioned] = @isProvisioned
					,[updatedDate] = @dt
					,[updatedBy] = @invokingUser
				WHERE [guid] = @guid AND [companyGuid] = @companyGuid AND [isDeleted] = 0
			END
		
		COMMIT TRAN

	END TRY

	BEGIN CATCH

	SET @output = 0
	DECLARE @errorReturnMessage nvarchar(MAX)

	SELECT
		@errorReturnMessage = ISNULL(@errorReturnMessage, ' ') + SPACE(1) +
		'ErrorNumber:' + ISNULL(CAST(ERROR_NUMBER() AS nvarchar), ' ') +
		'ErrorSeverity:' + ISNULL(CAST(ERROR_SEVERITY() AS nvarchar), ' ') +
		'ErrorState:' + ISNULL(CAST(ERROR_STATE() AS nvarchar), ' ') +
		'ErrorLine:' + ISNULL(CAST(ERROR_LINE() AS nvarchar), ' ') +
		'ErrorProcedure:' + ISNULL(CAST(ERROR_PROCEDURE() AS nvarchar), ' ') +
		'ErrorMessage:' + ISNULL(CAST(ERROR_MESSAGE() AS nvarchar(MAX)), ' ')

	RAISERROR (@errorReturnMessage
	, 11
	, 1
	)

	IF (XACT_STATE()) = -1 BEGIN
		ROLLBACK TRANSACTION
	END
	IF (XACT_STATE()) = 1 BEGIN
		ROLLBACK TRANSACTION
	END
	END CATCH
END